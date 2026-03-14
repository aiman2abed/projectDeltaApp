import models
import schemas
from database import SessionLocal, engine

db = SessionLocal()

def seed_full_curriculum():
    # Clear existing data to avoid primary key conflicts
    db.query(models.UserProgress).delete()
    db.query(models.Lesson).delete()
    db.query(models.Module).delete()
    
    # 1. Create Core Modules based on your ECE tracks
    modules = [
        models.Module(id=1, title="VLSI & Digital Design", description="CMOS and high-speed circuit design."),
        models.Module(id=2, title="High Voltage Engineering", description="Power systems and dielectric analysis."),
        models.Module(id=3, title="Advanced C Programming", description="Low-level memory and systems design."),
        models.Module(id=4, title="Computer Architecture", description="Pipelining and memory hierarchy.")
    ]
    
    db.add_all(modules)
    db.commit()

    lessons = [
        # --- MODULE 1: VLSI ---
        models.Lesson(
            module_id=1, title="Adder Architectures & Carry-Lookahead",
            content_text="CLA units calculate carries in parallel using Generate (G) and Propagate (P) signals to bypass O(n) ripple delay.",
            content_math="C_{i+1} = G_i + (P_i \cdot C_i)",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="What is the primary advantage of a Carry-Lookahead Adder (CLA)?",
            quiz_options=["Fewer gates", "Parallel carry calculation reduces delay", "Lower power", "Eliminates XOR"],
            correct_answer="Parallel carry calculation reduces delay"
        ),

        # --- MODULE 2: HIGH VOLTAGE ---
        models.Lesson(
            module_id=2, title="Dielectric Breakdown",
            content_text="Breakdown occurs when the electric field exceeds dielectric strength. Paschen's Law relates breakdown voltage to pressure and gap distance.",
            content_math="E = V/d",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="What happens to the dielectric strength of air as the gap between electrodes decreases?",
            quiz_options=["Increases", "Decreases", "Stays constant", "Becomes zero"],
            correct_answer="Increases"
        ),

        # --- MODULE 3: ADVANCED C (Referencing Course Material) ---
        models.Lesson(
            module_id=3, title="Pointer Arithmetic",
            content_text="In C, incrementing a pointer moves it by the size of the underlying type, not by a single byte.",
            content_math="p + n \Rightarrow \text{address} + (n \cdot \text{sizeof}(*p))",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="If 'int *p' is at 0x1000 and sizeof(int) is 4, what is the address of 'p + 2'?",
            quiz_options=["0x1002", "0x1004", "0x1008", "0x1016"],
            correct_answer="0x1008"
        ),
        models.Lesson(
            module_id=3, title="Struct Padding & Alignment",
            content_text="Compilers insert padding to ensure data is aligned to word boundaries for efficient CPU access.",
            content_math="\text{Offset} \pmod{\text{Alignment}} = 0",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="Why is padding added between a char and an int in a struct?",
            quiz_options=["To save memory", "To ensure the int starts on a 4-byte boundary", "To prevent overflow", "For endianness compatibility"],
            correct_answer="To ensure the int starts on a 4-byte boundary"
        ),
        models.Lesson(
            module_id=3, title="The Volatile Qualifier",
            content_text="Volatile tells the compiler a variable can change unexpectedly, preventing it from optimizing away memory reads.",
            content_math="\text{Memory Read} \neq \text{Cached Value}",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="When is 'volatile' most commonly used in Embedded systems?",
            quiz_options=["For loop counters", "For memory-mapped I/O registers", "For mathematical constants", "For string literals"],
            correct_answer="For memory-mapped I/O registers"
        ),
        models.Lesson(
            module_id=3, title="Dynamic Memory: Heap vs Stack",
            content_text="The heap provides persistent memory across function calls but requires manual 'free()' to prevent leaks.",
            content_math="\text{malloc}(size\_t) \rightarrow \text{void*}",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="Which memory area is automatically managed by function calls and local variables?",
            quiz_options=["Heap", "Stack", "Data Segment", "Registers"],
            correct_answer="Stack"
        ),
        models.Lesson(
            module_id=3, title="Function Pointers",
            content_text="Function pointers allow for dynamic dispatching and callbacks, enabling plugin-style architectures in C.",
            content_math="\text{void (*f)(int)}",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="What is a primary use for function pointers?",
            quiz_options=["Declaring global variables", "Implementing callbacks or jump tables", "Speeding up pointer arithmetic", "Allocating heap memory"],
            correct_answer="Implementing callbacks or jump tables"
        ),

        # --- MODULE 4: ARCHITECTURE (Referencing Course Material) ---
        models.Lesson(
            module_id=4, title="MIPS 5-Stage Pipeline",
            content_text="The MIPS pipeline overlaps instruction execution across IF, ID, EX, MEM, and WB stages.",
            content_math="\text{Ideal CPI} = 1",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="What does the 'IF' stage stand for in the MIPS pipeline?",
            quiz_options=["Instruction Flow", "Instruction Fetch", "Immediate Format", "Interrupt Flag"],
            correct_answer="Instruction Fetch"
        ),
        models.Lesson(
            module_id=4, title="Data Hazards & Forwarding",
            content_text="Forwarding allows a result to be used as soon as it is computed, bypassing the Write-Back stage.",
            content_math="\text{EX/MEM.RegisterRd} = \text{ID/EX.RegisterRs}",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="How does forwarding resolve a data hazard?",
            quiz_options=["By stalling the CPU", "By fetching the result directly from the ALU output", "By clearing the cache", "By reordering instructions"],
            correct_answer="By fetching the result directly from the ALU output"
        ),
        models.Lesson(
            module_id=4, title="Control Hazards & Branch Prediction",
            content_text="Control hazards occur because the CPU doesn't know the next instruction until a branch is resolved.",
            content_math="\text{Stall Penalty} = \text{Cycles to Resolve Branch}",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="Which technique reduces the penalty of control hazards?",
            quiz_options=["Loop unrolling", "Branch Prediction", "Virtual Memory", "Clock gating"],
            correct_answer="Branch Prediction"
        ),
        models.Lesson(
            module_id=4, title="Cache Mapping: Direct vs Associative",
            content_text="Associativity reduces conflict misses by allowing a memory block to reside in multiple cache locations.",
            content_math="\text{Index} = \text{Address} \pmod{\text{Sets}}",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="What is the benefit of a Set-Associative cache over a Direct-Mapped cache?",
            quiz_options=["Lower latency", "Lower cost", "Lower conflict miss rate", "Larger capacity"],
            correct_answer="Lower conflict miss rate"
        ),
        models.Lesson(
            module_id=4, title="RISC vs CISC Architecture",
            content_text="RISC focuses on simple, single-cycle instructions to maximize pipeline efficiency.",
            content_math="\text{Performance} = \frac{1}{\text{Execution Time}}",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            quiz_question="Which is a core characteristic of RISC architectures like MIPS?",
            quiz_options=["Complex, variable-length instructions", "Load-Store architecture", "High CPI", "Micro-coded control units"],
            correct_answer="Load-Store architecture"
        )
    ]

    for l in lessons:
        db.add(l)
    
    db.commit()
    print("Database Refreshed: 12 High-Quality ECE Lessons Seeded.")

if __name__ == "__main__":
    seed_full_curriculum()